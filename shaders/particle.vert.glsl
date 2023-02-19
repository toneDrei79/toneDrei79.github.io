uniform sampler2D tex;
uniform bool isShadow;
varying vec4 color;

void main() {
    color = texture2D (tex, position.xy);
    vec4 pos = vec4(color.rgb-vec3(.5,.5,.5), 1.0);
    if (isShadow) {
        color.rgb = vec3(0., 0., 0.);
        color.a = .2;
        pos.y = -.5;
    }

    gl_Position = projectionMatrix * modelViewMatrix * pos;

    float size = 25.0;
    float variance = 10.0;
    gl_PointSize = size / (-(modelViewMatrix*pos).z*variance);
}