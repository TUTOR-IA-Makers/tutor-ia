#include <stdio.h>

int main(void) {
    int n1, n2, n3, n4, n5;
    scanf("%d %d %d %d %d", &n1, &n2, &n3, &n4, &n5);
    if (n1!=n2 && n1!=n3 && n1!=n4 && n1!=n5 && n2!=n3 && n2!=n4 && n2!=n5 && n3!=n4 && n3!=n5 && n4!=n5) {
        int maior = n1 > n2 ? n1 : n2;
        int menor = n1 < n2 ? n1 : n2;
        if (n3 > maior) maior = n3; else if (n3 < menor) menor = n3;
        if (n4 > maior) maior = n4; else if (n4 < menor) menor = n4;
        if (n5 > maior) maior = n5; else if (n5 < menor) menor = n5;
        printf("%d\n%d\n", maior, menor);
    } else {
        printf("Os valores devem ser diferentes\n");
    }
    return 0;
}
