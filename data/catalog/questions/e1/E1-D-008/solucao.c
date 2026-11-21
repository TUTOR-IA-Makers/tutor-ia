#include <stdio.h>

int main(void) {
    double largura, comprimento, custo_m2;
    scanf("%lf %lf %lf", &largura, &comprimento, &custo_m2);
    double area = largura * comprimento;
    double area_com_perda = area * 1.10;
    double custo_total = area_com_perda * custo_m2;
    printf("%.2f\n%.2f\n", area_com_perda, custo_total);
    return 0;
}
