#include <iostream>
#include <vector>
using namespace std; 

struct Square
{
	int x;
	int y;
};

vector<Square> squares; 

void doSomething()
{
	Square s;
	s.x = 3;
	s.y = 5;
	squares.push_back(s);
}
int main()
{
	doSomething();
	cout << squares.size() << endl;
	cout << squares[0].x + squares[0].y <<endl;
}