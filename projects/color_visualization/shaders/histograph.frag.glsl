uniform sampler2D hist;
uniform float roughness;
uniform float quant;
varying vec2 _uv;


void main() {
    vec4 dat = texture2D(hist, _uv);
    float y = _uv.y * quant * roughness;

    vec4 color = vec4(0., 0., 0., 1.);
    if (y > dat.r && y > dat.g && y > dat.b) discard;
    if (y < dat.r) color.r = 1.0;
    if (y < dat.g) color.g = 1.0;
    if (y < dat.b) color.b = 1.0;
    
    gl_FragColor = color;
}