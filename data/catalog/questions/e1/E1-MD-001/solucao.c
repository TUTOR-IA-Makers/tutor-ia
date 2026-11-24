#include <stdio.h>

int main(void) {
    double valor;
    int centavos, n100, n50, n20, n10, n5, n2, m100, m50, m25, m10, m5, m1;
    scanf("%lf", &valor);
    centavos = (int)(valor * 100.0 + 0.5);
    n100 = centavos / 10000; centavos %= 10000;
    n50 = centavos / 5000; centavos %= 5000;
    n20 = centavos / 2000; centavos %= 2000;
    n10 = centavos / 1000; centavos %= 1000;
    n5 = centavos / 500; centavos %= 500;
    n2 = centavos / 200; centavos %= 200;
    m100 = centavos / 100; centavos %= 100;
    m50 = centavos / 50; centavos %= 50;
    m25 = centavos / 25; centavos %= 25;
    m10 = centavos / 10; centavos %= 10;
    m5 = centavos / 5; centavos %= 5;
    m1 = centavos;
    printf("NOTAS:\n");
    printf("%d nota(s) de R$ 100.00\n", n100);
    printf("%d nota(s) de R$ 50.00\n", n50);
    printf("%d nota(s) de R$ 20.00\n", n20);
    printf("%d nota(s) de R$ 10.00\n", n10);
    printf("%d nota(s) de R$ 5.00\n", n5);
    printf("%d nota(s) de R$ 2.00\n", n2);
    printf("MOEDAS:\n");
    printf("%d moeda(s) de R$ 1.00\n", m100);
    printf("%d moeda(s) de R$ 0.50\n", m50);
    printf("%d moeda(s) de R$ 0.25\n", m25);
    printf("%d moeda(s) de R$ 0.10\n", m10);
    printf("%d moeda(s) de R$ 0.05\n", m5);
    printf("%d moeda(s) de R$ 0.01\n", m1);
    return 0;
}
