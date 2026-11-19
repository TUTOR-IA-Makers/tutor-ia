#include <stdio.h>

int main(void) {
    int idade;
    scanf("%d", &idade);
    if (idade < 5) printf("sem categoria\n");
    else if (idade <= 7) printf("Infantil A\n");
    else if (idade <= 10) printf("Infantil B\n");
    else if (idade <= 13) printf("Juvenil A\n");
    else if (idade <= 17) printf("Juvenil B\n");
    else printf("Senior\n");
    return 0;
}
