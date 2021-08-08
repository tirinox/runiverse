uniform sampler2D baseTexture;
uniform float baseSpeed;
uniform float repeatS;
uniform float repeatT;

uniform sampler2D noiseTexture;
uniform float noiseScale;

uniform sampler2D blendTexture;
uniform float blendSpeed;
uniform float blendOffset;

uniform float time;
uniform float alpha;

uniform vec3 assetColor;
uniform vec3 assetColor2;
uniform vec3 sisterColor;
uniform float sistersDistance;

varying vec2 vUv;

varying vec3 vNormal;
varying float sisterProximity;

void main()
{
    vec2 uvTimeShift = vUv + vec2(-0.7, 1.5) * time * baseSpeed;
    vec4 noiseGeneratorTimeShift = texture2D(noiseTexture, uvTimeShift);
    vec2 uvNoiseTimeShift = vUv + noiseScale * vec2(noiseGeneratorTimeShift.r, noiseGeneratorTimeShift.b);
    vec4 baseColor = texture2D(baseTexture, uvNoiseTimeShift * vec2(repeatS, repeatT)) * vec4(assetColor, 1.0);

    vec2 uvTimeShift2 = vUv + vec2(1.3, -1.7) * time * blendSpeed;
    vec4 noiseGeneratorTimeShift2 = texture2D(noiseTexture, uvTimeShift2);
    vec2 uvNoiseTimeShift2 = vUv + noiseScale * vec2(noiseGeneratorTimeShift2.g, noiseGeneratorTimeShift2.b);
    vec4 blendColor = texture2D(blendTexture, uvNoiseTimeShift2 * vec2(repeatS, repeatT)) - blendOffset * vec4(1.0, 1.0, 1.0, 1.0);

    vec4 theColor = baseColor + blendColor * vec4(assetColor2, 1.0);
//    vec3 colorizer = mix(assetColor, assetColor2, vUv.y);
//    colorizer = vNormal.y > 0.0 ? mix(sisterColor, colorizer, sisterProximity * 0.1) : colorizer;
//    colorizer = mix(colorizer, sisterColor, pow(sisterProximity, 3.0) * 0.5);
    theColor = mix(theColor, vec4(sisterColor, 1.0), pow(sisterProximity, 1.0) * 0.5);

//    theColor *= vec4(colorizer, 1.0);
//    theColor = vec4(sisterProximity, sisterProximity, 0.0, 1.0);

    // edge lighting
    float f = pow(1.0 - abs(vNormal.z), 2.0);
    float sisterBrightness = mix(0.8, 2.5, f);

    theColor *= sisterBrightness;

    theColor.a = alpha;
    gl_FragColor = theColor;
}