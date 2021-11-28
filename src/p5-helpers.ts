import { Bodies, Svg, Body, Vector, Constraint, IBodyDefinition } from 'matter-js';
import P5 from 'p5';

declare module 'matter-js' {
  interface IBodyRenderOptions {
    text?: string;
    textColor?: string;
    fontSize?: number;
  }
}

export function drawVertices(p5: P5, vertices: Vector[], color = 'green'): void {
  p5.beginShape();
  p5.fill(color);
  for (let i = 0; i < vertices.length; i += 1) {
    p5.vertex(vertices[i].x, vertices[i].y);
  }
  p5.endShape(p5.CLOSE);
}

export function drawBody(p5: P5, body: Body): void {
  if (!body.render.visible) {
    return;
  }
  const bodies = body.parts?.length > 1 ? body.parts.slice(1) : [body];
  bodies.forEach((b) => drawVertices(p5, b.vertices, b.render.fillStyle));
  if (body.render.text) {
    const fontSize = body.render.fontSize || 12;
    p5.textSize(fontSize);
    p5.push();
    p5.translate(body.position.x, body.position.y);
    p5.rotate(body.angle);

    p5.fill(body.render.textColor || '#ffffff');
    p5.textAlign(p5.CENTER);
    p5.text(body.render.text, 0, fontSize / 3);
    p5.pop();
  }
}

export function drawBodies(p5: P5, bodies: Body[]): void {
  bodies.forEach((body) => drawBody(p5, body));
}

export function drawConstraint(p5: P5, constraint: Constraint): void {
  const offsetA = constraint.pointA;
  let posA = {
    x: 0,
    y: 0,
  };
  if (constraint.bodyA) {
    posA = constraint.bodyA.position;
  }
  const offsetB = constraint.pointB;
  let posB = {
    x: 0,
    y: 0,
  };
  if (constraint.bodyB) {
    posB = constraint.bodyB.position;
  }
  p5.line(posA.x + offsetA.x, posA.y + offsetA.y, posB.x + offsetB.x, posB.y + offsetB.y);
}

export function drawConstraints(p5: P5, constraints: Constraint[]): void {
  constraints.forEach((constraint) => drawConstraint(p5, constraint));
}

export function drawSprite(p5: P5, body: Body, img: Parameters<typeof p5.image>[0]): void {
  const pos = body.position;
  const { angle } = body;
  p5.push();
  p5.translate(pos.x, pos.y);
  p5.rotate(angle);
  p5.imageMode(p5.CENTER);
  p5.image(img, 0, 0);
  p5.pop();
}

export function drawText(p5: P5, body: Body, text: string): void {
  const pos = body.position;
  const { angle } = body;
  p5.push();
  p5.translate(pos.x, pos.y);
  p5.rotate(angle);
  p5.textAlign(p5.CENTER, p5.CENTER);
  p5.text(text, 0, 0);
  p5.ellipse(0, 10, 2, 2);
  p5.pop();
}

export function bodyFromPath(p5: P5, path: SVGPathElement, x: number, y: number, options: IBodyDefinition): Body {
  return Bodies.fromVertices(x, y, [Svg.pathToVertices(path, 10)], options);
}
