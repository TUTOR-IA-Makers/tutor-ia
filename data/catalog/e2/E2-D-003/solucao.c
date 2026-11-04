#include <stdio.h>

int main(void) {
    int n, acerto=0, quase=0, metade=0, erro=0;
    scanf("%d", &n);
    for (int i = 1; i <= n; i++) {
        if (i % 6 == 0)      { printf("acerto\n"); acerto++; }
        else if (i % 3 == 0) { printf("quase\n");  quase++;  }
        else if (i % 2 == 0) { printf("metade\n"); metade++; }
        else                 { printf("erro\n");   erro++;   }
    }
    printf("%d %d %d %d\n", acerto, quase, metade, erro);
    return 0;
}
