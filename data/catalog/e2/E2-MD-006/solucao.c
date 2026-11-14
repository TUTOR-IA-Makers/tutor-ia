#include <stdio.h>

int main(void) {
    int p1, p2, p3, aux;
    scanf("%d %d %d", &p1, &p2, &p3);
    if (p1 < p2) { aux = p1; p1 = p2; p2 = aux; }
    if (p1 < p3) { aux = p1; p1 = p3; p3 = aux; }
    if (p2 < p3) { aux = p2; p2 = p3; p3 = aux; }
    printf("%d %d %d\n", p1, p2, p3);
    int soma = p1 + p2 + p3;
    if (soma > 100) printf("%.2f\n", soma / 3.0);
    else printf("Equipe desclassificada\n");
    return 0;
}
