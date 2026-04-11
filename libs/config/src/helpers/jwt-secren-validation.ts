export function jwtSecretValidation(val: string) {
    const isLongEnough = val.length >= 32;
    const words = val.split('-');
    const hasFiveWords = words.length >= 5 && words.every((word) => word.length > 0);

    return isLongEnough || hasFiveWords;
}
