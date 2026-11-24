#include <stdio.h>

int main(void) {
    int n;
    double num, maior, menor;
    scanf("%d %lf", &n, &num);
    maior = menor = num;
    for (int i = 1; i < n; i++) {
        scanf("%lf", &num);
        if (num > maior) maior = num;
        if (num < menor) menor = num;
    }
    printf("%.2f\n%.2f\n", maior, menor);
    return 0;
}
