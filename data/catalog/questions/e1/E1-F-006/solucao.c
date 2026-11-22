#include <stdio.h>

int main(void) {
    double sm, qtdade, preco, vp, vd;
    scanf("%lf %lf", &sm, &qtdade);
    preco = sm / 700.0;
    vp = preco * qtdade;
    vd = vp * 0.9;
    printf("%.2f\n", preco);
    printf("%.2f\n", vp);
    printf("%.2f\n", vd);
    return 0;
}
