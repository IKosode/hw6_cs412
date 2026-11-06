function createCube() {
  const positions = new Float32Array([
    -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,   // front
     1, -1, -1,  -1, -1, -1,  -1,  1, -1,   1,  1, -1,   // back
    -1,  1,  1,   1,  1,  1,   1,  1, -1,  -1,  1, -1,   // top
    -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,   // bottom
     1, -1,  1,   1, -1, -1,   1,  1, -1,   1,  1,  1,   // right
    -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1    // left
  ]);
  const faceNormals = [[0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]];
  const normals = new Float32Array(faceNormals.flatMap(n => [...n, ...n, ...n, ...n]));

  // Tangent; bitangent = cross(N, T)
  const faceTangents = [[1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [0, 0, -1], [0, 0, 1]];
  const tangents = new Float32Array(faceTangents.flatMap(t => [...t, ...t, ...t, ...t]));

  const texCoords = new Float32Array(faceNormals.flatMap(() => [0, 0, 1, 0, 1, 1, 0, 1]));

  const indices = new Uint16Array([
     0,  1,  2,   0,  2,  3,   // front
     4,  5,  6,   4,  6,  7,   // back
     8,  9, 10,   8, 10, 11,   // top
    12, 13, 14,  12, 14, 15,   // bottom
    16, 17, 18,  16, 18, 19,   // right
    20, 21, 22,  20, 22, 23    // left
  ]);
  return { positions, normals, tangents, texCoords, indices };
}


function createCylinder(segments = 64, uRepeat = 3) {
  const positions = [], normals = [], tangents = [], texCoords = [], indices = [];

  // Side: theta grows with u, so T points along the circle and B = cross(N, T) points up
  for (let i = 0; i <= segments; i++) {
    const u = i / segments, theta = 2 * Math.PI * u;
    const s = Math.sin(theta), c = Math.cos(theta);
    for (const y of [-1, 1]) {
      positions.push(s, y, c);
      normals.push(s, 0, c);
      tangents.push(c, 0, -s);
      texCoords.push(u * uRepeat, (y + 1) / 2);
    }
  }
  for (let i = 0; i < segments; i++) {
    const k = 2 * i;
    indices.push(k, k + 2, k + 3, k, k + 3, k + 1);
  }

  // Caps: planar mapping of x, z into the texture, T = +x on both
  for (const y of [1, -1]) {
    const center = positions.length / 3;
    positions.push(0, y, 0);
    normals.push(0, y, 0);
    tangents.push(1, 0, 0);
    texCoords.push(0.5, 0.5);
    for (let i = 0; i <= segments; i++) {
      const theta = 2 * Math.PI * i / segments;
      const s = Math.sin(theta), c = Math.cos(theta);
      positions.push(s, y, c);
      normals.push(0, y, 0);
      tangents.push(1, 0, 0);
      texCoords.push(0.5 + 0.5 * s, 0.5 - 0.5 * y * c);  // keeps cross(N, T) along +v
    }
    for (let i = 0; i < segments; i++) {
      const a = center + 1 + i, b = a + 1;
      if (y > 0) indices.push(center, a, b);
      else indices.push(center, b, a);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}


/** Unit sphere centered at origin. UV sphere with poles. */
function createSphere(latBands = 48, lonBands = 64, uRepeat = 2, vRepeat = 1) {
  const positions = [], normals = [], tangents = [], texCoords = [], indices = [];

  for (let lat = 0; lat <= latBands; lat++) {
    const v = lat / latBands;
    const phi = v * Math.PI;               // 0..π
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    for (let lon = 0; lon <= lonBands; lon++) {
      const u = lon / lonBands;
      const theta = u * 2 * Math.PI;       // 0..2π
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      const x = sinPhi * sinTheta;
      const y = cosPhi;
      const z = sinPhi * cosTheta;

      positions.push(x, y, z);
      normals.push(x, y, z);
      // Tangent along +u (increasing longitude): ∂P/∂θ; fall back at poles
      let tx = sinPhi * cosTheta, ty = 0, tz = -sinPhi * sinTheta;
      const tLen = Math.hypot(tx, ty, tz);
      if (tLen < 1e-6) { tx = cosTheta; tz = -sinTheta; }
      else { tx /= tLen; tz /= tLen; }
      tangents.push(tx, ty, tz);
      texCoords.push(u * uRepeat, 1 - v * vRepeat);
    }
  }

  for (let lat = 0; lat < latBands; lat++) {
    for (let lon = 0; lon < lonBands; lon++) {
      const first = lat * (lonBands + 1) + lon;
      const second = first + lonBands + 1;
      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}


/** Cone with base in XZ at y=-1 and tip at y=+1. */
function createCone(segments = 64, uRepeat = 3) {
  const positions = [], normals = [], tangents = [], texCoords = [], indices = [];

  // Side normals: radius drops by 1 while height rises by 2 → N ∝ (2·radial, 1).
  // Surface: P(θ,t) = ((1-t)*sinθ, 2t-1, (1-t)*cosθ), t=0 at base, t=1 at tip.
  const nLen = Math.hypot(2, 1);
  const nRadial = 2 / nLen, nY = 1 / nLen;

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const theta = 2 * Math.PI * u;
    const s = Math.sin(theta), c = Math.cos(theta);
    const nx = s * nRadial, ny = nY, nz = c * nRadial;
    const tx = c, ty = 0, tz = -s;

    // base rim
    positions.push(s, -1, c);
    normals.push(nx, ny, nz);
    tangents.push(tx, ty, tz);
    texCoords.push(u * uRepeat, 0);

    // tip (duplicated per column so UVs wrap cleanly)
    positions.push(0, 1, 0);
    normals.push(nx, ny, nz);
    tangents.push(tx, ty, tz);
    texCoords.push(u * uRepeat, 1);
  }
  for (let i = 0; i < segments; i++) {
    const k = 2 * i;
    // base_i → base_{i+1} → tip_i (tip vertices share position, differ in UV/normal)
    indices.push(k, k + 2, k + 1);
  }

  // Base cap at y = -1
  {
    const center = positions.length / 3;
    positions.push(0, -1, 0);
    normals.push(0, -1, 0);
    tangents.push(1, 0, 0);
    texCoords.push(0.5, 0.5);
    for (let i = 0; i <= segments; i++) {
      const theta = 2 * Math.PI * i / segments;
      const s = Math.sin(theta), c = Math.cos(theta);
      positions.push(s, -1, c);
      normals.push(0, -1, 0);
      tangents.push(1, 0, 0);
      texCoords.push(0.5 + 0.5 * s, 0.5 + 0.5 * c);
    }
    for (let i = 0; i < segments; i++) {
      const a = center + 1 + i, b = a + 1;
      indices.push(center, b, a);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}


/** Torus in the XZ plane (tube around Y). */
function createTorus(majorSegments = 64, minorSegments = 32, R = 1.0, r = 0.35, uRepeat = 4, vRepeat = 2) {
  const positions = [], normals = [], tangents = [], texCoords = [], indices = [];

  for (let i = 0; i <= majorSegments; i++) {
    const u = i / majorSegments;
    const theta = u * 2 * Math.PI;
    const cosTheta = Math.cos(theta), sinTheta = Math.sin(theta);
    for (let j = 0; j <= minorSegments; j++) {
      const v = j / minorSegments;
      const phi = v * 2 * Math.PI;
      const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);

      const cx = R * cosTheta;
      const cz = R * sinTheta;
      const x = cx + r * cosPhi * cosTheta;
      const y = r * sinPhi;
      const z = cz + r * cosPhi * sinTheta;

      const nx = cosPhi * cosTheta;
      const ny = sinPhi;
      const nz = cosPhi * sinTheta;

      // Tangent along +u (major circle)
      const tx = -sinTheta;
      const ty = 0;
      const tz = cosTheta;

      positions.push(x, y, z);
      normals.push(nx, ny, nz);
      tangents.push(tx, ty, tz);
      texCoords.push(u * uRepeat, v * vRepeat);
    }
  }

  const stride = minorSegments + 1;
  for (let i = 0; i < majorSegments; i++) {
    for (let j = 0; j < minorSegments; j++) {
      const a = i * stride + j;
      const b = a + stride;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}
