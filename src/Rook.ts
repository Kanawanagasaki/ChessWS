///<reference path="Piece.ts" />
class Rook extends Piece
{
    public CanCastle:boolean;

    constructor(x:number, y:number, isWhite:boolean, board:Board)
    {
        super(x, y, isWhite, 4, board);
        this.CanCastle = true;
    }

    public GetPossibleMoves(pieces:{[row:number]:{[column:number]:Piece}}): { x: number; y: number; }[]
    {
        let ret:{ x: number; y: number; }[] = [];

        let directions =
        [
            {x:-1,y:0},
            {x:0,y:1},
            {x:0,y:-1},
            {x:1,y:0}
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

    public OnAfterMove()
    {
        this.CanCastle = false;
    }

    public Clone(): Piece
    {
        let ret = new Rook(this.X, this.Y, this.IsWhite, this.Board);
        ret.CanCastle = this.CanCastle;
        return ret;
    }
}