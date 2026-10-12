import matplotlib.pyplot as plt
import numpy as np

cycles = 3000 # number of cycles

# Prey
R_0 = 50 # initial population
a = 0.04 # intrinsic growth rate
K = 1200 # carrying capacity
b = 0.003 # per-capita attack rate of predators on prey

# Predators
F_0 = 20 # initial population
c = 0.01 # natural death rate
f = 0.02

##############################################################

R_e = c / (b * f)
F_e = (a / b) * (1 - R_e / K)

prey_population = [R_0]
predator_population = [F_0]
marker_size = 2

def R(n):
    R_n = prey_population[n - 1]
    F_n = predator_population[n - 1]

    return R_n + a * R_n * (1 - R_n / K) - b * R_n * F_n

def F(n):
    R_n = prey_population[n - 1]
    F_n = predator_population[n - 1]

    return F_n + f * b * R_n * F_n - c * F_n

def model():
    for i in range(1, cycles):
        prey_population.append(R(i))
        predator_population.append(F(i))
        
def plot_predator_prey():
    plt.figure(1)
    plt.axvline(x=R_e, color='red', linestyle='--')
    plt.axhline(y=F_e, color='red', linestyle='--')
    plt.plot(prey_population, predator_population, markersize=marker_size)
    plt.xlabel('Prey Population')
    plt.ylabel('Predator Population')
    plt.title('Predator vs Prey Population')
    
def plot_population_time():
    plt.figure(2)
    plt.axhline(y=F_e, color='red', linestyle='--')
    plt.axhline(y=R_e, color='red', linestyle='--')
    plt.plot(np.arange(cycles), prey_population, label='Prey Population', markersize=marker_size)
    plt.plot(np.arange(cycles), predator_population, label='Predator Population', markersize=marker_size)
    plt.ylabel('Population')
    plt.xlabel('Time')
    plt.title('Predator and Prey Populations over Time')
    plt.legend()

model()
plot_predator_prey()
plot_population_time()
plt.show()