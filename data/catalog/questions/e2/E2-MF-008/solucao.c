#include <stdio.h>

int main(void) {
    double sb, vp;
    scanf("%lf %lf", &sb, &vp);
    if (vp <= 0.3 * sb) {
        printf("emprestimo concedido\n");
    } else {
        printf("emprestimo negado\n");
    }
    return 0;
}
