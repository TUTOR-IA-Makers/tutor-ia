#include <stdio.h>

int main(void) {
    int idade;
    double peso, mg = 0;
    scanf("%d %lf", &idade, &peso);
    if (peso < 5.0) {
        printf("nao pode tomar\n");
        return 0;
    }
    if (idade >= 12) {
        mg = (peso >= 60.0) ? 1000.0 : 875.0;
    } else {
        if (peso <= 9.0) mg = 125.0;
        else if (peso <= 16.0) mg = 250.0;
        else if (peso <= 24.0) mg = 375.0;
        else if (peso <= 30.0) mg = 500.0;
        else mg = 750.0;
    }
    printf("%d\n", (int)(mg / 25.0));
    return 0;
}
