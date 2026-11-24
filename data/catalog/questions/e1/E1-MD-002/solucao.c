#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int a, b, c, maior_ab, maior;
    scanf("%d %d %d", &a, &b, &c);
    maior_ab = (a + b + abs(a - b)) / 2;
    maior = (maior_ab + c + abs(maior_ab - c)) / 2;
    printf("%d eh o maior\n", maior);
    return 0;
}
