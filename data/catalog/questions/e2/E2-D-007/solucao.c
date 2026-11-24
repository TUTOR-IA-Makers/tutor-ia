#include <stdio.h>

int main(void) {
    double indice;
    scanf("%lf", &indice);
    if (indice >= 0.5) printf("grupos 1, 2 e 3\n");
    else if (indice >= 0.4) printf("grupos 1 e 2\n");
    else if (indice >= 0.3) printf("grupo 1\n");
    else printf("aceitavel\n");
    return 0;
}
