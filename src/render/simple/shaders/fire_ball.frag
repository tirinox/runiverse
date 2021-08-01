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

varying vec2 vUv;

void main()
{
    float myTime = time * 6.0;
    vec2 uvTimeShift = vUv + vec2(-0.7, 1.5) * myTime * baseSpeed;
    vec4 noiseGeneratorTimeShift = texture2D(noiseTexture, uvTimeShift);
    vec2 uvNoiseTimeShift = vUv + noiseScale * vec2(noiseGeneratorTimeShift.r, noiseGeneratorTimeShift.b);
    vec4 baseColor = texture2D(baseTexture, uvNoiseTimeShift * vec2(repeatS, repeatT));

    vec2 uvTimeShift2 = vUv + vec2(1.3, -1.7) * myTime * blendSpeed;
    vec4 noiseGeneratorTimeShift2 = texture2D(noiseTexture, uvTimeShift2);
    vec2 uvNoiseTimeShift2 = vUv + noiseScale * vec2(noiseGeneratorTimeShift2.g, noiseGeneratorTimeShift2.b);
    vec4 blendColor = texture2D(blendTexture, uvNoiseTimeShift2 * vec2(repeatS, repeatT)) - blendOffset * vec4(1.0, 1.0, 1.0, 1.0);

    vec4 theColor = baseColor + blendColor;
    theColor.rgb *= assetColor;
    theColor.a = alpha;
    gl_FragColor = theColor;
}