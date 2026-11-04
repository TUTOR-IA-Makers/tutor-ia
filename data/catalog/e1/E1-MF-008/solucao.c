#include <stdio.h>

int main(void) {
    double preco;
    int qtd;
    scanf("%lf %d", &preco, &qtd);
    printf("%.2f\n", preco * qtd);
    return 0;
}
