#include <stdio.h>

int main(void) {
    double cotacao, dolares;
    scanf("%lf %lf", &cotacao, &dolares);
    printf("%.2f\n", cotacao * dolares);
    return 0;
}
