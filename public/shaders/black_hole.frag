
varying vec3 rayOrigin;
varying vec3 hitPosition;

uniform samplerCube texEnvironMap;
uniform sampler2D texNoise;

uniform float time;

const float pi = 3.1415927;

float sdSphere(vec3 p, float s) {
    return length(p) - s;
}

float sdCappedCylinder(vec3 p, vec2 h) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - h;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

vec4 blackHole(vec3 ro, vec3 rd) {
    const vec3 blackHolePosition = vec3(0.0, 0.0, 0.0);
    const float blackHoleRadius = 0.01;
    const float blackHoleMass = 5.0 * 0.0001;  // premul G = 0.001

    vec3 currentRayPos = ro; // currentPosition
    vec3 currentRayDir = rd; // currentRay direction

    vec3 accColor = vec3(0.0);

    float nonCaptured = 1.0;

    const vec3 c1 = vec3(0.5, 0.46, 0.4);
    const vec3 c2 = vec3(1.0, 0.8, 0.6);
    const vec3 glowC = vec3(1.0, 0.9, 0.85);

    const int maxSteps = 320;
    const float dt = 0.04; // ray step. default: 0.02

    float dToBlackHole = length(currentRayPos - blackHolePosition);
    currentRayPos += currentRayDir * (dToBlackHole - 5.0); // pre step to BH

    for (int i = 0; i < maxSteps; i++) {
        currentRayPos += currentRayDir * dt * nonCaptured;

        // gravity
        vec3 bhv = blackHolePosition - currentRayPos;
        float r = dot(bhv, bhv);
        currentRayDir += normalize(bhv) * ((blackHoleMass) / r);

        nonCaptured = smoothstep(0.0, 0.666, sdSphere(currentRayPos - blackHolePosition, blackHoleRadius));

        // Texture for the accretion disc
        float dr = length(bhv.xz);
        float da = atan(bhv.x, bhv.z);
        vec2 ra = vec2(dr, da * (0.01 + (dr - blackHoleRadius) * 0.002) + 2.0 * pi + time * 0.005);
        ra *= vec2(10.0, 20.0);

        float textureRead = texture(texNoise, ra * vec2(0.1, 0.5)).r + 0.5;
//        float textureRead = 1.0;

        // max(0.0,texture(iChannel1,ra*vec2(0.1,0.5)).r+0.05
        vec3 dcol = mix(c2, c1, pow(length(bhv) - blackHoleRadius, 2.0)) * max(0.0, textureRead) * (4.0 / ((0.001 + (length(bhv) - blackHoleRadius) * 50.0)));

        accColor += max(vec3(0.0), dcol * smoothstep(0.0, 1.0, -sdTorus((currentRayPos * vec3(1.0, 25.0, 1.0)) - blackHolePosition, vec2(0.8, 0.99))) * nonCaptured);
//        accColor += dcol * (1.0 / dr) * nonCaptured * 0.01; // pole streams!

        // Glow
        accColor += glowC * (1.0 / vec3(dot(bhv, bhv))) * 0.0001 * nonCaptured;
    }

    // BG
//    accColor += pow(texture(texEnvironMap, currentRayDir).rgb, vec3(3.0)) * nonCaptured;
    vec3 envUV = vec3(-currentRayDir.x, currentRayDir.y, currentRayDir.z);
    accColor += texture(texEnvironMap, envUV).rgb * nonCaptured;

    // FInal color
    return vec4(accColor, 1.0);
}

void main() {
    vec3 rayDirection = normalize(hitPosition - rayOrigin);
    gl_FragColor = blackHole(rayOrigin, rayDirection);
}