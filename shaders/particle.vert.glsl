uniform sampler2D tex;
uniform int mode;
uniform bool isShadow;
varying vec4 color;

vec3 linearize(vec3 srgb) {
    vec3 linear;
    for (int i=0; i<3; i++) {
        if (srgb[i] > .04045) {
            linear[i] = pow((srgb[i]+.055)/1.055, 2.4);
        }
        else {
            linear[i] = srgb[i] / 12.92;
        }
    }
    return linear;
}

vec3 toCIEXYZ(vec3 rgb) {
    mat3 mat = mat3(
        .4124, .3576, .1805,
        .2126, .7152, .0722,
        .0193, .1192, .9505
    );
    return rgb*mat;
}

vec3 toCIExyY(vec3 XYZ) {
    vec3 xyz;
    xyz.x = XYZ.x / (XYZ.x+XYZ.y+XYZ.z);
    xyz.y = XYZ.y / (XYZ.x+XYZ.y+XYZ.z);
    xyz.z = 1. - xyz.x - xyz.y;
    xyz.y = XYZ.y;
    return xyz;
}

float f(float t) {
    if (t > .008856) return pow(t, .333);
    return (903.296*t + 16.) / 116.;
}

vec3 toCIELab(vec3 XYZ) {
    vec3 Lab;
    Lab.y = 166. * f(XYZ.y) - 16.; // L
    Lab.x = 500. * (f(XYZ.x) - f(XYZ.y)); // a
    Lab.z = 200. * (f(XYZ.y) - f(XYZ.z)); // b
    // normalize
    Lab.y /= 150.;
    Lab.x /= 128.;
    Lab.z /= 128.;
    // rotate -45
    float PI = 3.1415;
    Lab.x = Lab.x*cos(PI/4.) + Lab.z*sin(PI/4.);
    Lab.z = Lab.x*sin(PI/4.) - Lab.z*cos(PI/4.);
    return Lab;
}

void main() {
    color = texture2D(tex, position.xy);

    vec4 pos;
    if (mode == 0) {
        pos = vec4(color.gbr-vec3(.5,.5,.5), 1.);
    }
    else if (mode == 1) {
        vec3 linear = linearize(color.rgb);
        pos = vec4(toCIEXYZ(linear).yzx-vec3(.5,.5,.5), 1.);
    }
    else if (mode == 2) {
        vec3 linear = linearize(color.rgb);
        vec3 XYZ = toCIEXYZ(linear);
        pos = vec4(toCIExyY(XYZ).xyz-vec3(.5,.5,.5), 1.);
    }
    else if (mode == 3) {
        vec3 linear = linearize(color.rgb);
        vec3 XYZ = toCIEXYZ(linear);
        pos = vec4(toCIELab(XYZ).xyz-vec3(0.,.5,0.), 1.);
    }

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