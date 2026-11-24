#include <stdio.h>

int main(void) {
    int a, b;
    scanf("%d %d", &a, &b);
    if (a == b) {
        printf("iguais\n");
    } else {
        int maior = a > b ? a : b;
        if (maior % 2 == 0) printf("%d par\n", maior);
        else printf("%d impar\n", maior);
    }
    return 0;
}
