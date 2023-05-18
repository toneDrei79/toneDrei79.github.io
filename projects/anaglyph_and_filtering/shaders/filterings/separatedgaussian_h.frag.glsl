precision highp float;
uniform sampler2D image;
uniform vec2 resolution;
uniform int kernelsize;
uniform float sigma;

in vec2 vUv;
out vec4 fragColor;

const float PI = 3.1415;
const float e = 2.7183;

void main(void) {
    vec2 uv = vUv.xy;
    
    vec2 cellSize = 1./resolution.xy;
    vec4 textureValue = vec4(0.);

    float filterSum = 0.;
    for (int i=-kernelsize/2; i<kernelsize/2+kernelsize%2; i++) {
        float gaussianValue = 1./(2.*PI*pow(sigma,2.)) * pow(e,-float(i*i)/(2.*pow(sigma,2.))); // take probability value from gaussian curve
        textureValue += gaussianValue * texture2D(image, uv + vec2(float(i)*cellSize.x, 0.));
        filterSum += gaussianValue;
    }
    textureValue /= filterSum;

    fragColor = textureValue;
}