uniform sampler2D tex;
uniform vec3 color;
uniform float roughness;

void main() {
    // vec3 rgb = texture2D (tex, position.xy).rgb;
    // float pos = dot(color, rgb);
    
    ivec2 texSize = textureSize(tex, 0);
    ivec2 texelCoord = ivec2(gl_VertexID/texSize.x, gl_VertexID%texSize.x);
    vec3 rgb = texelFetch(tex, texelCoord, 0).rgb;
    float pos = dot(color, rgb);

    gl_Position = vec4(2.*pos - 1., 0., 0., 1.0);
    if (256.*pos < roughness) gl_PointSize = 256.*pos;
    else if (256.*pos > 256.-roughness) gl_PointSize = 256. - 256.*pos;
    else gl_PointSize = roughness;
}