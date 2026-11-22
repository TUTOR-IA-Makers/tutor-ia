#include <stdio.h>
#include <math.h>

int main(void) {
    double base, altura, perimetro, area, diagonal;
    scanf("%lf %lf", &base, &altura);
    perimetro = 2.0 * (base + altura);
    area = base * altura;
    diagonal = sqrt(base * base + altura * altura);
    printf("%.2f\n", perimetro);
    printf("%.2f\n", area);
    printf("%.2f\n", diagonal);
    return 0;
}
