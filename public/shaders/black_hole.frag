
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
    const float blackHoleRadius = 0.3;
    const float blackHoleMass = 5.0 * 0.00001;  // premul G = 0.001
    const vec3 c1 = vec3(0.4, 0.46, 0.5);
    const vec3 c2 = vec3(0.6, 0.8, 0.8);
    const vec3 glowC = vec3(0.85, 0.9, 1.0);
    const float glowFac = 0.00014;

    const int maxSteps = 320; // 320 default
    const float dt = 0.03; // ray step. default: 0.02

    const float animationSeed = 3.0;

    vec3 currentRayPos = ro; // currentPosition
    vec3 currentRayDir = rd; // currentRay direction

    vec3 accColor = vec3(0.0);

    float nonCaptured = 1.0;

    // pre-step
    float dToBlackHole = length(currentRayPos - blackHolePosition);
    currentRayPos += currentRayDir * (dToBlackHole - 5.0); // pre step to BH

    for (int i = 0; i < maxSteps; i++) {
        currentRayPos += currentRayDir * dt * nonCaptured; // todo: step according distance to black hole, so maxSteps may be lower!!

        // gravity
        vec3 bhv = blackHolePosition - currentRayPos;
        float r = dot(bhv, bhv);
        currentRayDir += normalize(bhv) * ((blackHoleMass) / r);

        nonCaptured = smoothstep(0.0, 0.666, sdSphere(currentRayPos - blackHolePosition, blackHoleRadius));

        // Texture for the accretion disc
        float dr = length(bhv.xz);
        float da = atan(bhv.x, bhv.z);

        vec2 ra = vec2(dr, da * (0.01 + (dr - blackHoleRadius) * 0.002) + 2.0 * pi + time * animationSeed);
        ra *= vec2(5.0, 10.0);

        float textureRead = texture(texNoise, ra * vec2(0.1, 0.5)).r + 0.5;

        vec3 dcol = mix(c2, c1, pow(length(bhv) - blackHoleRadius, 2.0)) * max(0.0, textureRead) * (4.0 / ((0.001 + (length(bhv) - blackHoleRadius) * 50.0)));

        accColor += max(vec3(0.0), dcol * smoothstep(0.0, 1.0, -sdTorus((currentRayPos * vec3(1.0, 25.0, 1.0)) - blackHolePosition, vec2(0.8, 0.99))) * nonCaptured);
        // accColor += dcol * (1.0 / dr) * nonCaptured * 0.01; // pole streams!

        // Glow
        accColor += glowC * (1.0 / vec3(dot(bhv, bhv))) * glowFac * nonCaptured;
    }

    // BG
//    vec3 envUV = vec3(-currentRayDir.x, currentRayDir.y, currentRayDir.z);
    vec3 envUV = currentRayDir;
    accColor += texture(texEnvironMap, envUV).rgb * nonCaptured;

    // Final color
    return vec4(accColor, 1.0);
}

void main() {
    vec3 rayDirection = normalize(hitPosition - rayOrigin);
    gl_FragColor = blackHole(rayOrigin, rayDirection);
}