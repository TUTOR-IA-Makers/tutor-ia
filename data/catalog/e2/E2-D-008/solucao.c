#include <stdio.h>

int main(void) {
    double x, soma = 1.0, termo = 1.0;
    int n;
    scanf("%lf %d", &x, &n);
    for (int i = 1; i < n; i++) {
        termo = termo * x / i;
        soma += termo;
    }
    printf("%.4f\n", soma);
    return 0;
}
