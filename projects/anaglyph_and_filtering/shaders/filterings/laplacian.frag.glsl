precision highp float;
uniform sampler2D image;
uniform vec2 resolution;

in vec2 vUv;
out vec4 fragColor;

void main(void) {
    vec2 uv = vUv.xy;
    
    vec2 cellSize = 1./resolution.xy;
    vec4 textureValue = vec4(0.);

    for (int j=-1; j<=1; j++) {
        for (int i=-1; i<=1; i++) {
            float laplacianValue = (i==0 && j==0)? -8. : 1.; // laplacian filter with 8 neighbours
            textureValue += laplacianValue * texture2D(image, uv + vec2(float(i)*cellSize.x, float(j)*cellSize.y));
        }
    }

    fragColor = textureValue;
}