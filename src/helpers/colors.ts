import {hashedParameterFloat, hashedParameterFloat01} from "@/helpers/data_utils";
import {Color} from "three";

export const RUNE_COLOR = 0x28f4af
export const RUNE_COLOR_GRAD_1 = 0x31fd9c
export const RUNE_COLOR_GRAD_2 = 0x01cefd

export function hashedColorHue(input: string, path: string, saturation: number = 1.0, luminance: number = 0.5) {
    const color = new Color(0, 0, 0)
    color.setHSL(hashedParameterFloat01(input, path), saturation, luminance)
    return color
}

export function hashedColorHueSaturation(input: string, path: string, luminance: number = 0.5) {
    const color = new Color(0, 0, 0)
    color.setHSL(
        hashedParameterFloat01(input, path + 'hue'),
        hashedParameterFloat01(input, path + 'saturation'),
        luminance)
    return color
}

export function hashedColorBright(input: string, path: string) {
    const color = new Color(0, 0, 0)
    color.setHSL(
        hashedParameterFloat01(input, path + 'hue'),
        hashedParameterFloat(input, path + 'saturation', 0.8, 1.0),
        hashedParameterFloat(input, path + 'luminance', 0.5, 0.9)
    )
    return color
}
