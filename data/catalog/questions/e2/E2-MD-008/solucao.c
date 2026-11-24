#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    if (n % 2 == 0 && n > 15) {
        printf("par maior que 15\n");
    } else if (n % 2 != 0 && n < 50) {
        printf("impar menor que 50\n");
    } else {
        printf("nenhuma condicao\n");
    }
    return 0;
}
