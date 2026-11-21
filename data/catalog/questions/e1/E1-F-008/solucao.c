#include <stdio.h>

int main(void) {
    double potencia, horas;
    scanf("%lf %lf", &potencia, &horas);
    printf("%.2f\n", potencia * horas * 30.0 / 1000.0);
    return 0;
}
