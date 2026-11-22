#include <stdio.h>

int main(void) {
    double tempo, vel, dist, litros;
    scanf("%lf %lf", &tempo, &vel);
    dist = tempo * vel;
    litros = dist / 12.0;
    printf("%.2f\n", vel);
    printf("%.2f\n", tempo);
    printf("%.2f\n", dist);
    printf("%.2f\n", litros);
    return 0;
}
