#include <stdio.h>

int main(void) {
    double x1, y1, x2, y2;
    scanf("%lf %lf %lf %lf", &x1, &y1, &x2, &y2);
    double largura = x2 > x1 ? x2 - x1 : x1 - x2;
    double altura = y2 > y1 ? y2 - y1 : y1 - y2;
    double perimetro = 2.0 * (largura + altura);
    double area = largura * altura;
    printf("%.2f\n%.2f\n", perimetro, area);
    return 0;
}
