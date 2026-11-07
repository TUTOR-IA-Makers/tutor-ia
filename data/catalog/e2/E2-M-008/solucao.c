#include <stdio.h>

int main(void) {
    int atual, anterior = -1;
    int ordenada = 1;
    while (1) {
        scanf("%d", &atual);
        if (atual == 0) break;
        if (anterior != -1 && atual <= anterior) {
            ordenada = 0;
        }
        anterior = atual;
    }
    if (ordenada) printf("ordenada\n");
    else printf("desordenada\n");
    return 0;
}
