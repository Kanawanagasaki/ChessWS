abstract class Piece
{
    public static IMG:HTMLImageElement = new Image();
    public static IMG_PIECE_WIDTH = 0;
    public static IMG_PIECE_HEIGHT = 0;

    public X:number;
    public Y:number;
    public PrevX:number;
    public PrevY:number;

    public Width:number;
    public Height:number;

    public IsWhite:boolean;

    private _imgX:number;

    protected Board:Board;

    constructor(x:number, y:number, isWhite:boolean, sourceX:number, board:Board)
    {
        this.IsWhite = isWhite;
        this._imgX = sourceX;

        this.X = x;
        this.Y = y;
        this.Width = board.PieceWidth;
        this.Height = board.PieceHeight;

        this.Board = board;
    }

    public MoveTo(x:number, y:number)
    {
        this.PrevX = this.X;
        this.PrevY = this.Y;
        this.X = x;
        this.Y = y;
    }

    public Draw(ctx:CanvasRenderingContext2D)
    {
        if(this.Board.IsPlayingAsWhite)
            this._draw(ctx, this.X * this.Width, (7 - this.Y) * this.Height);
        else
            this._draw(ctx, (7 - this.X) * this.Width, this.Y * this.Height);
    }

    public DrawDraggin(ctx:CanvasRenderingContext2D, x:number, y:number)
    {
        this._draw(ctx, x - this.Width / 2, y - this.Height / 2);
    }

    private _draw(ctx:CanvasRenderingContext2D, x:number, y:number)
    {
        ctx.drawImage(Piece.IMG,
            this._imgX * Piece.IMG_PIECE_WIDTH,
            this.IsWhite ? 0 : Piece.IMG_PIECE_HEIGHT,
            Piece.IMG_PIECE_WIDTH,
            Piece.IMG_PIECE_HEIGHT,
            x,
            y,
            this.Width,
            this.Height);
    }

    public OnAfterMove() {}

    public abstract GetPossibleMoves(pieces:{[row:number]:{[column:number]:Piece}}):{x:number, y:number}[];

    public abstract Clone():Piece;
}

Piece.IMG.src = "chessPieces.png";
Piece.IMG.onload = ()=>
{
    Piece.IMG_PIECE_WIDTH = Math.floor(Piece.IMG.width / 6);
    Piece.IMG_PIECE_HEIGHT = Math.floor(Piece.IMG.height / 2);
};