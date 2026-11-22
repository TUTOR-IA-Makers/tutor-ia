#include <stdio.h>

int main(void) {
    double distancia, combustivel;
    scanf("%lf %lf", &distancia, &combustivel);
    printf("%.2f\n", distancia / combustivel);
    return 0;
}
