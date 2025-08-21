"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Circle, ArrowRight, Square, Undo, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Tool = "circle" | "arrow" | "square";
type Shape = {
  type: Tool;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
};

const colors = ["#E74C3C", "#5DADE2", "#58D68D", "#F1C40F", "#FFFFFF"];

export function ImageAnnotator({ imageUrl }: { imageUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>("square");
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentColor, setCurrentColor] = useState(colors[0]);

  const drawShapes = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    shapes.forEach((shape) => {
      context.strokeStyle = shape.color;
      context.lineWidth = 3;
      context.beginPath();

      if (shape.type === "square") {
        context.rect(
          shape.startX,
          shape.startY,
          shape.endX - shape.startX,
          shape.endY - shape.startY
        );
      } else if (shape.type === "circle") {
        const radiusX = Math.abs(shape.endX - shape.startX) / 2;
        const radiusY = Math.abs(shape.endY - shape.startY) / 2;
        const centerX = shape.startX + radiusX;
        const centerY = shape.startY + radiusY;
        context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      } else if (shape.type === "arrow") {
        const headlen = 10;
        const dx = shape.endX - shape.startX;
        const dy = shape.endY - shape.startY;
        const angle = Math.atan2(dy, dx);
        context.moveTo(shape.startX, shape.startY);
        context.lineTo(shape.endX, shape.endY);
        context.lineTo(
          shape.endX - headlen * Math.cos(angle - Math.PI / 6),
          shape.endY - headlen * Math.sin(angle - Math.PI / 6)
        );
        context.moveTo(shape.endX, shape.endY);
        context.lineTo(
          shape.endX - headlen * Math.cos(angle + Math.PI / 6),
          shape.endY - headlen * Math.sin(angle + Math.PI / 6)
        );
      }
      context.stroke();
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const image = new Image();
    image.src = imageUrl;
    image.onload = () => {
        if(canvas && container) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const imageAspectRatio = image.width / image.height;
            const containerAspectRatio = containerWidth / containerHeight;

            let canvasWidth, canvasHeight;

            if (imageAspectRatio > containerAspectRatio) {
                canvasWidth = containerWidth;
                canvasHeight = containerWidth / imageAspectRatio;
            } else {
                canvasHeight = containerHeight;
                canvasWidth = containerHeight * imageAspectRatio;
            }

            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            drawShapes();
        }
    }
  }, [imageUrl, shapes]);
  
  useEffect(drawShapes, [shapes]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const pos = getMousePos(e);
    setStartPoint(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    
    drawShapes(); // Redraw existing shapes

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if(!context) return;
    
    context.strokeStyle = currentColor;
    context.lineWidth = 3;
    context.beginPath();

    const shape: Shape = { type: tool, startX: startPoint.x, startY: startPoint.y, endX: pos.x, endY: pos.y, color: currentColor };
    
    if (shape.type === "square") {
        context.rect(shape.startX, shape.startY, shape.endX - shape.startX, shape.endY - shape.startY);
    } else if (shape.type === "circle") {
        const radiusX = Math.abs(shape.endX - shape.startX) / 2;
        const radiusY = Math.abs(shape.endY - shape.startY) / 2;
        const centerX = shape.startX + radiusX;
        const centerY = shape.startY + radiusY;
        context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    } else if (shape.type === "arrow") {
        const headlen = 10;
        const dx = shape.endX - shape.startX;
        const dy = shape.endY - shape.startY;
        const angle = Math.atan2(dy, dx);
        context.moveTo(shape.startX, shape.startY);
        context.lineTo(shape.endX, shape.endY);
        context.lineTo(shape.endX - headlen * Math.cos(angle - Math.PI / 6), shape.endY - headlen * Math.sin(angle - Math.PI / 6));
        context.moveTo(shape.endX, shape.endY);
        context.lineTo(shape.endX - headlen * Math.cos(angle + Math.PI / 6), shape.endY - headlen * Math.sin(angle + Math.PI / 6));
    }
    context.stroke();
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const pos = getMousePos(e);
    setShapes([
      ...shapes,
      { type: tool, startX: startPoint.x, startY: startPoint.y, endX: pos.x, endY: pos.y, color: currentColor },
    ]);
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const undoLastShape = () => {
    setShapes(shapes.slice(0, -1));
  };
  
  const clearAll = () => {
    setShapes([]);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Button variant={tool === "square" ? "secondary" : "ghost"} size="icon" onClick={() => setTool("square")}>
                <Square />
            </Button>
            <Button variant={tool === "circle" ? "secondary" : "ghost"} size="icon" onClick={() => setTool("circle")}>
                <Circle />
            </Button>
            <Button variant={tool === "arrow" ? "secondary" : "ghost"} size="icon" onClick={() => setTool("arrow")}>
                <ArrowRight />
            </Button>
            <div className="w-px h-8 bg-border mx-2" />
            <div className="flex gap-1">
                {colors.map(color => (
                    <button key={color} onClick={() => setCurrentColor(color)} className={cn("w-6 h-6 rounded-full border-2", currentColor === color ? 'border-accent' : 'border-transparent' )} style={{backgroundColor: color}} />
                ))}
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={undoLastShape} disabled={shapes.length === 0}>
                <Undo />
            </Button>
             <Button variant="ghost" size="icon" onClick={clearAll} disabled={shapes.length === 0}>
                <Trash2 />
            </Button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 flex items-center justify-center bg-muted/20 p-4 overflow-hidden relative">
        <img
          src={imageUrl}
          alt="annotation-base"
          className="max-w-full max-h-full object-contain"
          style={{ visibility: "hidden" }}
        />
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
          className="absolute"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />
      </div>
       <div className="p-2 border-t flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button>Save and Share</Button>
        </div>
    </div>
  );
}
