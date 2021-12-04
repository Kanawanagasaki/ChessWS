///<reference path="Piece.ts" />
class Bishop extends Piece
{
    constructor(x:number, y:number, isWhite:boolean, board:Board)
    {
        super(x, y, isWhite, 2, board);
    }

    public GetPossibleMoves(pieces:{[row:number]:{[column:number]:Piece}}): { x: number; y: number; }[]
    {
        let ret:{x:number, y:number}[] = [];

        let directions =
        [
            {x:-1,y:-1},
            {x:-1,y:1},
            {x:1,y:-1},
            {x:1,y:1}
        ];

        while(directions.length > 0)
        {
            for(let i = 0; i < directions.length; i++)
            {
                if(this.X + directions[i].x < 0 || this.X + directions[i].x > 7 ||
                    this.Y + directions[i].y < 0 || this.Y + directions[i].y > 7)
                {
                    directions.splice(i, 1);
                    continue;
                }

                if((this.X + directions[i].x) in pieces[this.Y + directions[i].y])
                {
                    if(pieces[this.Y + directions[i].y][this.X + directions[i].x].IsWhite != this.IsWhite)
                        ret.push({x:this.X + directions[i].x, y:this.Y + directions[i].y});
                    
                    directions.splice(i, 1);
                    continue;
                }

                ret.push({x:this.X + directions[i].x, y:this.Y + directions[i].y});
                directions[i].x += Math.sign(directions[i].x);
                directions[i].y += Math.sign(directions[i].y);
            }
        }

        return ret;
    }

    public Clone(): Piece
    {
        return new Bishop(this.X, this.Y, this.IsWhite, this.Board);
    }
}