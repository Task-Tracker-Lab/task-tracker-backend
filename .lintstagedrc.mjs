export default {
   '*.{ts,js}': [
        'eslint --fix',
        'prettier --write'
    ],
    '*.{json,css,md,yaml,yml}': ['prettier --write'],
};
