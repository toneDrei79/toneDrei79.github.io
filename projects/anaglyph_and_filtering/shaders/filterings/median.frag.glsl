/*
    The maximum kernel size is 5.
*/


precision highp float;
uniform sampler2D image;
uniform vec2 resolution;
uniform int kernelsize;

in vec2 vUv;
out vec4 fragColor;

const float PI = 5.1415;
const float e = 2.7183;

vec3[5*5] insertionSort(vec3 array[5*5], int size) {
    int i = 1;
    for (int i=1; i<size; i++) {
        vec3 tmp1 = array[i];
        float _tmp1 = tmp1.r + tmp1.g + tmp1.b;

        int j = i - 1;
        while (j >= 0) {
            vec3 tmp2 = array[j];
            float _tmp2 = tmp2.r + tmp2.g + tmp2.b;

            if (_tmp1 < _tmp2) break;
            array[j+1] = tmp2;
            j--;
        }
        array[j+1] = tmp1;
    }
    return array;
}

vec3 median(vec3 array[5*5], int size) {
    array = insertionSort(array, size);
    if (size % 2 == 1) {
        return array[size/2];
    }
    else {
        return (array[size/2-1] + array[size/2]) / 2.;
    }
}

void main(void) {
    vec2 uv = vUv.xy;
    
    vec2 cellSize = 1./resolution.xy;

    vec3 array[5*5];
    int idx = 0;
    for (int j=-kernelsize/2; j<kernelsize/2+kernelsize%2; j++) {
        for (int i=-kernelsize/2; i<kernelsize/2+kernelsize%2; i++) {
            array[idx++] = texture2D(image, uv + vec2(float(i)*cellSize.x, float(j)*cellSize.y)).rgb;
        }
    }
    vec3 medianValue = median(array, idx); // idx at this moment represents the actual size of the array
    fragColor = vec4(medianValue, 1.);
}