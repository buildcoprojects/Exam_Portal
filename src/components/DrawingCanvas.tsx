'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Pencil, Eraser, Square, Circle, Type, Undo, Trash2, Save } from 'lucide-react';

interface DrawingCanvasProps {
  questionId: string;
  existingDrawing?: string;
  onSave: (drawing: string) => void;
}

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'text';

interface DrawAction {
  tool: Tool;
  color: string;
  width: number;
  points?: { x: number; y: number }[];
  rect?: { x: number; y: number; width: number; height: number };
  text?: { x: number; y: number; content: string };
}

export default function DrawingCanvas({ questionId, existingDrawing, onSave }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#ef4444');
  const [lineWidth, setLineWidth] = useState(3);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [currentAction, setCurrentAction] = useState<DrawAction | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 600;

    // Draw grid background
    drawGrid(ctx);

    // Load existing drawing if available
    if (existingDrawing) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = existingDrawing;
    }
  }, [existingDrawing]);

  useEffect(() => {
    redraw();
  }, [actions]);

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;

    const gridSize = 20;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and redraw grid
    drawGrid(ctx);

    // Draw all actions
    actions.forEach((action) => {
      drawAction(ctx, action);
    });

    // Draw current action
    if (currentAction) {
      drawAction(ctx, currentAction);
    }
  };

  const drawAction = (ctx: CanvasRenderingContext2D, action: DrawAction) => {
    ctx.strokeStyle = action.color;
    ctx.fillStyle = action.color;
    ctx.lineWidth = action.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (action.tool === 'pen' || action.tool === 'eraser') {
      if (action.points && action.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(action.points[0].x, action.points[0].y);
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(action.points[i].x, action.points[i].y);
        }
        ctx.stroke();
      }
    } else if (action.tool === 'rectangle' && action.rect) {
      ctx.strokeRect(action.rect.x, action.rect.y, action.rect.width, action.rect.height);
    } else if (action.tool === 'circle' && action.rect) {
      const centerX = action.rect.x + action.rect.width / 2;
      const centerY = action.rect.y + action.rect.height / 2;
      const radius = Math.sqrt(action.rect.width ** 2 + action.rect.height ** 2) / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (action.tool === 'text' && action.text) {
      ctx.font = '16px sans-serif';
      ctx.fillText(action.text.content, action.text.x, action.text.y);
    }
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setIsSaved(false);
    const pos = getMousePos(e);

    if (tool === 'pen' || tool === 'eraser') {
      setCurrentAction({
        tool,
        color: tool === 'eraser' ? '#1e293b' : color,
        width: tool === 'eraser' ? 20 : lineWidth,
        points: [pos],
      });
    } else if (tool === 'rectangle' || tool === 'circle') {
      setCurrentAction({
        tool,
        color,
        width: lineWidth,
        rect: { x: pos.x, y: pos.y, width: 0, height: 0 },
      });
    } else if (tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const action: DrawAction = {
          tool: 'text',
          color,
          width: lineWidth,
          text: { x: pos.x, y: pos.y, content: text },
        };
        setActions([...actions, action]);
      }
      setIsDrawing(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAction) return;

    const pos = getMousePos(e);

    if (tool === 'pen' || tool === 'eraser') {
      setCurrentAction({
        ...currentAction,
        points: [...(currentAction.points || []), pos],
      });
    } else if ((tool === 'rectangle' || tool === 'circle') && currentAction.rect) {
      setCurrentAction({
        ...currentAction,
        rect: {
          ...currentAction.rect,
          width: pos.x - currentAction.rect.x,
          height: pos.y - currentAction.rect.y,
        },
      });
    }

    redraw();
  };

  const handleMouseUp = () => {
    if (currentAction) {
      setActions([...actions, currentAction]);
      setCurrentAction(null);
    }
    setIsDrawing(false);
  };

  const handleUndo = () => {
    setActions(actions.slice(0, -1));
    setIsSaved(false);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all drawings?')) {
      setActions([]);
      setIsSaved(false);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    setIsSaved(true);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <div className="p-4 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            <Button
              variant={tool === 'pen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('pen')}
              className={tool === 'pen' ? 'bg-blue-600' : 'border-slate-600'}
            >
              <Pencil className="w-4 h-4 mr-1" />
              Pen
            </Button>
            <Button
              variant={tool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('eraser')}
              className={tool === 'eraser' ? 'bg-blue-600' : 'border-slate-600'}
            >
              <Eraser className="w-4 h-4 mr-1" />
              Eraser
            </Button>
            <Button
              variant={tool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('rectangle')}
              className={tool === 'rectangle' ? 'bg-blue-600' : 'border-slate-600'}
            >
              <Square className="w-4 h-4 mr-1" />
              Rectangle
            </Button>
            <Button
              variant={tool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('circle')}
              className={tool === 'circle' ? 'bg-blue-600' : 'border-slate-600'}
            >
              <Circle className="w-4 h-4 mr-1" />
              Circle
            </Button>
            <Button
              variant={tool === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('text')}
              className={tool === 'text' ? 'bg-blue-600' : 'border-slate-600'}
            >
              <Type className="w-4 h-4 mr-1" />
              Text
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Color:</span>
            {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ffffff'].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded border-2 ${color === c ? 'border-white' : 'border-slate-600'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <Separator orientation="vertical" className="h-8" />

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Size:</span>
            {[2, 3, 5, 8].map((w) => (
              <Button
                key={w}
                variant={lineWidth === w ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLineWidth(w)}
                className={lineWidth === w ? 'bg-blue-600' : 'border-slate-600'}
              >
                {w}px
              </Button>
            ))}
          </div>

          <Separator orientation="vertical" className="h-8" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={actions.length === 0}
            className="border-slate-600"
          >
            <Undo className="w-4 h-4 mr-1" />
            Undo
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={actions.length === 0}
            className="border-slate-600"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>

          <Button
            onClick={handleSave}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="w-4 h-4 mr-1" />
            {isSaved ? 'Saved' : 'Save Drawing'}
          </Button>

          {isSaved && (
            <Badge className="bg-emerald-600">
              Drawing Saved
            </Badge>
          )}
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full border-2 border-slate-600 rounded-lg cursor-crosshair"
        />
      </div>
    </Card>
  );
}
