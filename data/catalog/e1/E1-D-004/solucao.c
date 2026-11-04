#include <stdio.h>

int main(void) {
    double capital, inflacao;
    int anos;
    scanf("%lf %lf %d", &capital, &inflacao, &anos);
    double poder = capital;
    for(int i=0; i<anos; i++) {
        poder = poder / (1.0 + inflacao / 100.0);
    }
    printf("%.2f\n", poder);
    return 0;
}
