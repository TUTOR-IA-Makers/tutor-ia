#include <stdio.h>

int main(void) {
    int data, dia, mes, ano, vd = 1;
    scanf("%d", &data);
    dia = data / 1000000;
    mes = (data % 1000000) / 10000;
    ano = data % 10000;
    if (ano < 1 || mes < 1 || mes > 12 || dia < 1 || dia > 31) {
        vd = 0;
    } else if ((mes == 4 || mes == 6 || mes == 9 || mes == 11) && dia > 30) {
        vd = 0;
    } else if (mes == 2) {
        int bissexto = (ano % 4 == 0 && ano % 100 != 0) || (ano % 400 == 0);
        if (dia > (bissexto ? 29 : 28)) vd = 0;
    }
    printf("%s\n", vd ? "DATA VALIDA" : "DATA INVALIDA");
    return 0;
}
