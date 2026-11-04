#include <stdio.h>

int main(void) {
    double tol, pi_sobre_4 = 0.0, termo = 1.0;
    int count = 0, sinal = 1, div = 1;
    scanf("%lf", &tol);
    while (1) {
        termo = 1.0 / div;
        if (termo < tol) break;
        pi_sobre_4 += sinal * termo;
        sinal *= -1;
        div += 2;
        count++;
    }
    printf("%.6f\n%d\n", pi_sobre_4 * 4.0, count);
    return 0;
}
