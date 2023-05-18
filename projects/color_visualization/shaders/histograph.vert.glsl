uniform sampler2D hist;
varying vec2 _uv;

void main() {
    _uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4 (position.x, position.y, position.z, 1.0);
}