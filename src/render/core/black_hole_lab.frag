varying vec3 rayOrigin;
varying vec3 hitPosition;

uniform samplerCube texEnvironMap;
uniform sampler2D texNoise;

uniform float time;


const int MAX_MARCHING_STEPS = 255;
const float MIN_DIST = 0.0;
const float MAX_DIST = 100.0;
const float EPSILON = 0.0001;


float sdSphere(vec3 p, float s) {
    return length(p) - s;
}


float sceneSDF(vec3 p) {
    return sdSphere(p, 0.5);
}


float distance(vec3 eye, vec3 marchingDirection, float start, float end) {
    float depth = start;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        float dist = sceneSDF(eye + depth * marchingDirection);
        if (dist < EPSILON) {
            return depth;
        }
        depth += dist;
        if (depth >= end) {
            return end;
        }
    }
    return end;
}


vec4 rayMarching(vec3 ro, vec3 rd) {
    float dist = distance(ro, rd, MIN_DIST, MAX_DIST);

    if (dist > MAX_DIST - EPSILON) {
        // Didn't hit anything
        return texture(texEnvironMap, rd);
    }
    return vec4(0.0, 0.0, 0.0, 1.0);
}

void main() {
    vec3 rayDirection = normalize(hitPosition - rayOrigin);
    vec4 bhColor = rayMarching(rayOrigin, rayDirection);
    gl_FragColor = bhColor;
}