import matplotlib.pyplot as plt
import numpy as np

p_0 = 5 # initial population
r = 0.1 # intrinsic growth rate
K = 500 # carrying capacity
n = 100 # number of cycles

def p_n():
    populations = [p_0]

    for i in range(n):
        p_n = populations[i]
        # Pn+1 = Pn + r * Pn * (1 – Pn / K)
        p_n1 = p_n + r * p_n * (1 - p_n / K)
        populations.append(p_n1)

    return populations

def plot_p_n():
    x = list(range(n + 1))
    y = p_n()

    plt.figure(1)
    plt.plot(x, y, 'o')
    plt.xlabel('n')
    plt.ylabel('Pn')
    plt.title('Pn+1 = Pn + r * Pn * (1 - Pn / K)')
    
def delta_p_p(P):
    return r * (1 - P / K)
    
def plot_delta_p_p():
    x = p_n()
    y = []
    for i in range(1, n):
        delta_p = (x[i + 1] - x[i - 1]) / 2
        y.append(delta_p / x[i])
        
    del x[0]
    del x[-1]

    x_reg = np.linspace(0, x[-1], 2)
    y_reg = delta_p_p(x_reg)

    plt.figure(2)
    plt.plot(x, y, 'o')
    plt.plot(x_reg, y_reg)
    plt.xlim(0, K)
    plt.ylim(0, r)
    plt.xlabel('Pn')
    plt.ylabel('∆P/P')
    plt.title('ΔP/P = r * (1 - P / K)')

plot_p_n()
plot_delta_p_p()
plt.show()